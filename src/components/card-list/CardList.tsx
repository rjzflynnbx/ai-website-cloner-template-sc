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
import { useSitecore } from '@sitecore-content-sdk/nextjs';
import { ComponentProps } from 'lib/component-props';

interface CardFields {
  Title: Field<string>;
  Description: RichTextField;
  CardImage: ImageField;
  CardLink: LinkField;
}

interface CardItem {
  id: string;
  name: string;
  fields: CardFields;
}

interface Fields {
  Heading: Field<string>;
  children: CardItem[];
}

export type CardListProps = ComponentProps & {
  fields: Fields;
};

export const Default = (props: CardListProps): JSX.Element => {
  const id = props.params.RenderingIdentifier;
  const { page } = useSitecore();
  const isEditing = page.mode.isEditing;
  const cards = props.fields.children ?? [];

  return (
    <section
      className={`component card-list ${props.params.styles ?? ''}`}
      id={id ? id : undefined}
    >
      <div className="container mx-auto px-6 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold">
          <Text field={props.fields.Heading} />
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.id}
              className="overflow-hidden rounded-xl bg-white shadow-lg transition-shadow hover:shadow-xl"
            >
              <div className="aspect-video overflow-hidden">
                <ContentSdkImage
                  field={card.fields.CardImage}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="space-y-3 p-6">
                <h3 className="text-xl font-semibold">
                  <Text field={card.fields.Title} />
                </h3>
                <div className="text-gray-600">
                  <RichText field={card.fields.Description} />
                </div>
                <Link field={card.fields.CardLink} className="main-btn inline-block" />
              </div>
            </div>
          ))}
          {isEditing && cards.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center text-gray-400">
              Add card items in the Content Editor
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
