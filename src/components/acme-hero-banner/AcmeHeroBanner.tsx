import React, { JSX } from 'react';
import {
  Text,
  RichText,
  NextImage as ContentSdkImage,
  Link,
  Field,
  ImageField,
  LinkField,
  RichTextField,
} from '@sitecore-content-sdk/nextjs';
import { ComponentProps } from 'lib/component-props';

interface Fields {
  Title: Field<string>;
  Subtitle: RichTextField;
  BackgroundImage: ImageField;
  CTALink: LinkField;
}

export type AcmeHeroBannerProps = ComponentProps & {
  fields: Fields;
};

export const Default = (props: AcmeHeroBannerProps): JSX.Element => {
  const id = props.params.RenderingIdentifier;

  return (
    <section
      className={`component acme-hero-banner ${props.params.styles ?? ''}`}
      id={id ? id : undefined}
    >
      <div className="relative flex min-h-[60vh] items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <ContentSdkImage
            field={props.fields.BackgroundImage}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center text-white">
          <h1 className="mb-4 text-4xl font-bold md:text-6xl">
            <Text field={props.fields.Title} />
          </h1>
          <div className="mb-8 text-lg md:text-xl">
            <RichText field={props.fields.Subtitle} />
          </div>
          <Link field={props.fields.CTALink} className="main-btn" />
        </div>
      </div>
    </section>
  );
};
